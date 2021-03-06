import React from 'react';
import { View, Button, Image, TouchableHighlight, 
  ActivityIndicator, FlatList, Animated, TouchableOpacity, TextInput, ScrollView, Picker } from 'react-native';
import WegpiraatService from '../service/wegpiraatservice';
import s from '../styles/styles';
import con from '../configuration/settings';
import Modal from 'react-native-modal';
import { Text, SearchBar } from 'react-native-elements';

export default class FeedScreen extends React.Component {

  constructor(props) {
    super(props);
    this.service = new WegpiraatService();
    this.state = {
      data: null,
      loading: false,
      scrolling: false,
      page: 1,
      total: 0,
      showModal: false,
      comments: [],
      comment: "",
      selected: null,
      commenting: false,
      options: false,
      deleteModal: false,
      sortType: "",
      country: true,
      sort: false,
      selectedSort: "",
      selectedCountry: ""
    }
  }

  static navigationOptions = ({navigation}) => ({
    headerTitle: "Go back"
  });

  async componentDidMount(){
    await this.getData();
  }

  getData = async() => {
    await this.setState({loading:true, page:1}); //reset the page count 
    let data = await this.service.getWegpiraten(1, this.props.navigation.getParam('filterType', 'none'), this.props.navigation.getParam('filter', ''));
    await this.setState({data:data.docs, total:data.pages, loading:false});
  };

  scrollData = async() => {
    //only if there are any more pages
    if (this.state.page <= this.state.total) {
      await this.setState({scrolling:true, page:this.state.page + 1}); //increment page
      let data = await this.service.getWegpiraten(this.state.page, this.props.filterType, this.props.filter);
      await this.setState({data:this.state.data.concat(data.docs), scrolling:false});
    }
  }

  changeSortMethod = async(sortType) => {
    await this.setState({sortType: sortType});
    if (sortType == "country") {
      await this.setState({country: true});
      await this.setState({sort: false});
    } else {
      await this.setState({sort: true});
      await this.setState({country: false});
    }
  }

  sortBy = async() => {

  }

  header = () => {
    return (
      <View style={{padding: 20}}>
        <View style={s.rowContainer}>
        <Text>Sort by: </Text>
          <Picker style={{width:150}}
                selectedValue={this.state.sortType}
                onValueChange={(val, index) => this.changeSortMethod(val)}>
                <Picker.Item label="Country" value="country" />
                <Picker.Item label="Likes" value="likes" />
                <Picker.Item label="Comments" value="comments" />
          </Picker>
          { !!this.state.country &&
          <Picker style={{width:140}} selectedValue={this.state.selectedCountry}
                onValueChange={(val, index) => this.sortBy(val)}>
                <Picker.Item label="Belgium" value="BE" />
                <Picker.Item label="Netherlands" value="NL" />
                <Picker.Item label="Germany" value="DE" />
                <Picker.Item label="France" value="FR" />
          </Picker>
          }
          { !!this.state.sort &&
          <Picker  style={{width:140}} selectedValue={this.state.selectedSort}
                onValueChange={(val, index) => this.sortBy(val)}>
                <Picker.Item label="Descending" value="DESC" />
                <Picker.Item label="Ascending" value="ASC" />
          </Picker>  
          }        
        </View>
      </View>
      )
  }

  footer = () => {
    if (!this.state.scrolling) return null;
    return (
      <View style={{ paddingVertical: 20, borderTopWidth: 1, borderColor: "#CED0CE", alignItems:"center" }} >
        <Text h3>Loading more pirates</Text>
        <ActivityIndicator animating size="large" />
      </View>
    );  
  };

  like = async(id) => {
      let res = await this.service.like(id);
      if (res) {
        let data = this.state.data;
        for(let i = 0; i < data.length; i++) {
            if (data[i]._id == id) { //found the post
              data[i].liked = !data[i].liked; //reverse the like
              if (data[i].liked) {
                data[i].likeImg = require("../public/like.png");  
                data[i].likeCount = ++data[i].likeCount;                
              } else {
                data[i].likeImg = require("../public/unlike.png");
                data[i].likeCount = --data[i].likeCount; 
              }
            }
        }
        await this.setState({data:data}); //rerender the data
      }
  }

  comment = async() => {
      await this.setState({commenting:true});
      let resp = await this.service.comment(this.state.selected, this.state.comment);
      if (resp) {
        let comments = [resp].concat(this.state.comments);
        await this.setState({comments, comments, comment:"", commenting:false});
      }
  }

  options = async(item) => {
    await this.setState({options:true, selected:item});
  }

  edit = async() => {    
  }

  delete = async() => {

  }

  share = async() => {

  }

  render() {

    if(this.state.loading){
      return(
        <View style={{flex: 1, padding:40, alignItems:"center", backgroundColor:"rgb(254,241,207)"}}>   
          <Text h3>Loading the pirates...</Text>       
          <Image style={{height:400}} source={require('../public/loading.gif')}/>          
        </View>
      )
    }

    return (
      <View>
        <FlatList
          onRefresh={() => this.getData()}
          refreshing={this.state.loading}
          onEndReachedThreshold={0.3}
          onEndReached={() => this.scrollData()}
          data={this.state.data}
          renderItem={({item}) => {
            return (
            <View style={s.container}>
              <View style={s.flatContainer}>                
                <Text h3 style={s.centeredStandardText}>{item.title}</Text>                
                <Image style={s.image} source={{uri:item.picture}}></Image>
                <View style={s.iconRowContainer}>
                  <TouchableOpacity style={s.iconButton} onPress={() => this.like(item._id)}>
                    <Image style={s.icon} source={item.likeImg}/><Text>{item.likeCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.iconButton} onPress={() => this.options(item)}>
                    <Image style={s.icon} source={require('../public/more.png')}/>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.iconButton} onPress={() => this.setState({showModal:true,comments:item.comments,selected:item._id})}>
                    <Image style={s.icon} source={require('../public/comment.png')}/><Text>{item.comments.length}</Text>
                  </TouchableOpacity>
                </View>                
              </View>
              <View><Text>{item.createdAt}</Text></View>
            </View>
            )
          }
          }
          ListHeaderComponent={this.header}
          ListFooterComponent={this.footer}>
        </FlatList>

        <Modal
          style={s.scrollContainerCenter}
          isVisible={this.state.showModal} animationOut="fadeOutUp"
          backdropOpacity={0.5} onBackdropPress={() => this.setState({showModal:false})} >
          <View style={s.modalContainer}>
            <TextInput style={s.multiline} placeholder="Comment here (max. 80 characters)" 
              onChangeText={(text)=>this.setState({comment:text})} value={this.state.comment} maxLength={80} multiline={true}/>
            <TouchableOpacity style={s.optionsButton} onPress={()=> { this.comment() }}>
              {this.state.commenting && <ActivityIndicator animating={true} color="black" /> }   
              <Text style={s.standardButtonText}>Comment</Text>
            </TouchableOpacity>
            <ScrollView style={{width:250}}>
              <FlatList 
                data={this.state.comments}
                renderItem={({item}) => {
                  return (
                    <View style={s.commentContainer}>
                      <Text style={s.commentHeader}>{item.postedBy}</Text>
                      <Text style={s.commentBody}>{item.commentData}</Text>
                    </View>
                  )
                }} />
            </ScrollView>
          </View>
        </Modal>

        <Modal
          style={s.scrollContainerCenter}
          isVisible={this.state.options} animationOut="fadeOutUp"
          backdropOpacity={0.5} onBackdropPress={() => this.setState({options:false})} >
          <View style={s.optionsContainer}>
            <TouchableOpacity style={s.optionsButton} onPress={()=> { this.edit() }}>  
              <Text style={s.standardButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.optionsButton} onPress={()=> { this.share() }}>   
              <Text style={s.standardButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.optionsButton, s.deleteButton]} onPress={()=> { this.setState({deleteModal: true}); }}>   
              <Text style={[s.standardButtonText, s.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal
          style={s.scrollContainerCenter}
          isVisible={this.state.deleteModal}
          backdropOpacity={0.5} onBackdropPress={() => this.setState({deleteModal:false})} >
          <View style={s.optionsContainer}>
            <Text style={s.h2}>
                Are you sure you want to delete this post?
            </Text>
            <TouchableOpacity style={s.optionsButton} onPress={()=> { this.delete(item) }}>   
              <Text style={s.standardButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.optionsButton} onPress={()=> { this.delete(item) }}>   
              <Text style={s.standardButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>  
    )
  }
}